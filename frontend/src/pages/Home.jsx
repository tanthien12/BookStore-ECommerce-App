import React from "react";
import BannerAds from "../components/layout/BannerAds";
import FlashSale from "../components/layout/FlashSale";
import TrendingShelf from "../components/layout/TrendingShelf";
import SuggestForYou from "../components/layout/SuggestForYou";
import SiteFooter from "../components/layout/SiteFooter";

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