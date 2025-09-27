import React from "react";
import BannerAds from "../components/BannerAds";
import FlashSale from "../components/FlashSale";
import TrendingShelf from "../components/TrendingShelf";
import SuggestForYou from "../components/SuggestForYou";
import SiteFooter from "./SiteFooter";

export default function Home() {
  return (
    <>
      <BannerAds /> 
      <FlashSale />
      <TrendingShelf />
      <SuggestForYou />
      {/* các section khác */}
      <SiteFooter />
    </>
  );
}
