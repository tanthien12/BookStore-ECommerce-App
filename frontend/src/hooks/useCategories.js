import { useEffect, useState } from "react";
import summaryApi from "../common";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchCategories() {
      try {
        const res = await fetch(summaryApi.url("/categories"));

        // FIX LỖI: Fetch không tự throw lỗi khi gặp 404/500, phải check thủ công
        if (!res.ok) {
          throw new Error(`HTTP Error! Status: ${res.status}`);
        }

        // Cố gắng parse JSON
        let json = null;
        try {
          json = await res.json();
        } catch (parseErr) {
          console.error("Lỗi parse JSON:", parseErr);
          // Nếu parse lỗi thì dừng luôn, không xử lý tiếp
          if (active) setCategories([]);
          return;
        }

        if (!active) return;

        // Xử lý các định dạng dữ liệu trả về khác nhau
        let list = [];
        if (Array.isArray(json)) {
          list = json;
        } else if (json && Array.isArray(json.data)) {
          list = json.data;
        } else if (json && Array.isArray(json.items)) {
          list = json.items;
        } else {
          list = [];
        }

        setCategories(list);
      } catch (err) {
        console.error("Lỗi tải category:", err);
        if (active) setCategories([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}

// // src/hooks/useCategories.js
// import { useEffect, useState } from "react";
// import summaryApi from "../common";

// export default function useCategories() {
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let active = true;

//     async function fetchCategories() {
//       try {
//         const res = await fetch(summaryApi.url("/categories"));
//         // backend của bạn đôi khi trả sai cú pháp → mình vẫn cố gắng đọc
//         let json = null;
//         try {
//           json = await res.json();
//         } catch (err) {
//           console.error("Parse JSON category lỗi:", err);
//           json = null;
//         }

//         if (!active) return;

//         // các trường hợp có thể gặp:
//         // 1) { success: true, data: [...] }
//         // 2) { items: [...], total: ... }
//         // 3) [...] (trả thẳng mảng)
//         let list = [];

//         if (Array.isArray(json)) {
//           list = json;
//         } else if (json && Array.isArray(json.data)) {
//           list = json.data;
//         } else if (json && Array.isArray(json.items)) {
//           list = json.items;
//         } else {
//           list = [];
//         }

//         setCategories(list);
//       } catch (err) {
//         console.error("Lỗi tải category:", err);
//         if (active) setCategories([]);
//       } finally {
//         if (active) setLoading(false);
//       }
//     }

//     fetchCategories();

//     return () => {
//       active = false;
//     };
//   }, []);

//   return { categories, loading };
// }
