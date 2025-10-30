// src/pages/Home.jsx
import React from "react";
import FlashSale from "../components/layout/FlashSale";
import TrendingShelf from "../components/layout/TrendingShelf";
import SuggestForYou from "../components/layout/SuggestForYou";
import BannerAds from "../components/layout/BannerAds";
import SiteFooter from "../components/layout/SiteFooter";

export default function Home() {
  return (
    <div className="max-w-[1280px] mx-auto px-3 md:px-4 py-4">
      <BannerAds />

      {/* 3 cái này tự gọi hook bên trong */}
      <FlashSale />
      <TrendingShelf />
      <SuggestForYou />

      <SiteFooter />
    </div>
  );
}
