// src/hooks/useVNAddress.js
import { useEffect, useState, useCallback } from "react";

export default function useVNAddress() {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Lấy danh sách tỉnh/thành
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingProvince(true);
        setError(null);
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();

        // ✅ sort tên theo thứ tự bảng chữ cái tiếng Việt
        const list = Array.isArray(data)
          ? data
              .map((item) => ({
                code: String(item.code),
                name: item.name,
              }))
              .sort((a, b) => a.name.localeCompare(b.name, "vi"))
          : [];

        setProvinces(list);
      } catch (err) {
        console.error("Fetch provinces error:", err);
        setError("Không tải được tỉnh/thành");
      } finally {
        setLoadingProvince(false);
      }
    };

    fetchProvinces();
  }, []);

  // 🔹 Lấy quận/huyện theo tỉnh
  const fetchDistricts = useCallback(async (provinceCode) => {
    if (!provinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    try {
      setLoadingDistrict(true);
      setError(null);
      const res = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      const data = await res.json();

      const districtsData = Array.isArray(data.districts)
        ? data.districts
            .map((d) => ({
              code: String(d.code),
              name: d.name,
            }))
            // ✅ sắp xếp theo tên
            .sort((a, b) => a.name.localeCompare(b.name, "vi"))
        : [];

      setDistricts(districtsData);
      setWards([]);
    } catch (err) {
      console.error("Fetch districts error:", err);
      setError("Không tải được quận/huyện");
      setDistricts([]);
      setWards([]);
    } finally {
      setLoadingDistrict(false);
    }
  }, []);

  // 🔹 Lấy phường/xã theo quận
  const fetchWards = useCallback(async (_provinceCode, districtCode) => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    try {
      setLoadingWard(true);
      setError(null);
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      const data = await res.json();

      const wardsData = Array.isArray(data.wards)
        ? data.wards
            .map((w) => ({
              code: String(w.code),
              name: w.name,
            }))
            // ✅ sắp xếp theo tên
            .sort((a, b) => a.name.localeCompare(b.name, "vi"))
        : [];

      setWards(wardsData);
    } catch (err) {
      console.error("Fetch wards error:", err);
      setError("Không tải được phường/xã");
      setWards([]);
    } finally {
      setLoadingWard(false);
    }
  }, []);

  return {
    provinces,
    districts,
    wards,
    fetchDistricts,
    fetchWards,
    loadingProvince,
    loadingDistrict,
    loadingWard,
    error,
  };
}
