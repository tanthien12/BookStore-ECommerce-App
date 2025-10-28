// frontend/src/hooks/useVNAddress.js
import { useEffect, useState } from "react";

export default function useVNAddress() {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    async function fetchProvinces() {
        const res = await fetch("/api/address/provinces");
        const data = await res.json();
        if (data.success) setProvinces(data.data);
    }

    async function fetchDistricts(provinceCode) {
        const res = await fetch(`/api/address/districts?provinceCode=${provinceCode}`);
        const data = await res.json();
        if (data.success) setDistricts(data.data);
    }

    async function fetchWards(provinceCode, districtCode) {
        const res = await fetch(
            `/api/address/wards?provinceCode=${provinceCode}&districtCode=${districtCode}`
        );
        const data = await res.json();
        if (data.success) setWards(data.data);
    }

    useEffect(() => {
        fetchProvinces();
    }, []);

    return {
        provinces,
        districts,
        wards,
        fetchDistricts,
        fetchWards,
    };
}