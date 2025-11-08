// src/pages/Home.jsx
import React from "react";
import FlashSale from "../components/layout/FlashSale";
import TrendingShelf from "../components/layout/TrendingShelf";
import SuggestForYou from "../components/layout/SuggestForYou";
import BannerAds from "../components/layout/BannerAds";
import CategorySection from "../components/layout/CategorySection";


export default function Home() {
  return (
    <div className="max-w-[1280px] mx-auto px-3 md:px-4 py-4">
      <BannerAds />

      {/* 3 cái này tự gọi hook bên trong */}
      <FlashSale />
      <CategorySection />
      <TrendingShelf />
      <SuggestForYou />

      
    </div>
  );
}
