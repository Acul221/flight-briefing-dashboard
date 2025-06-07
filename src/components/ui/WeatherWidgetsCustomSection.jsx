// src/components/ui/WeatherWidgetsCustomSection.jsx

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { Navigation, Autoplay, Pagination, Scrollbar } from "swiper/modules";
import WeatherWidgetCustom from "./WeatherWidgetCustom";
import SectionTitle from "./SectionTitle";

export default function WeatherWidgetsCustomSection() {
  const cities = [
    "Jakarta",
    "Surabaya",
    "Denpasar",
    "Medan",
    "Pontianak",
    "Ambon",
    "Makassar",
    "Balikpapan",
    "Tarakan",
    "Singapore",
    "Kuala Lumpur",
    "Nanjing",
  ];

  return (
    <section className="space-y-4">
      <SectionTitle icon="🌤️" title="Weather Widgets" />
      <Swiper
        modules={[Navigation, Autoplay, Pagination, Scrollbar]}
        spaceBetween={16}
        autoplay={{ delay: 9000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
        loop
        breakpoints={{
          320: { slidesPerView: 1.2 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }, //Dekstop
        }}
        className="pb-4"
      >
        {cities.map((city) => (
          <SwiperSlide key={city} className="!w-64">
            <WeatherWidgetCustom city={city} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
