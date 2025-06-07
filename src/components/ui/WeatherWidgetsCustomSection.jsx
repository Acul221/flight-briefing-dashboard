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
    "Aceh",
    "Medan",
    "Pekanbaru",
    "Padang",
    "Jambi",
    "Palembang",
    "Pangkalpinang",
    "Jakarta",
    "Semarang",
    "Surabaya",
    "Denpasar",
    "Lampung",
    "Pontianak",
    "Balikpapan",
    "Tarakan",
    "Surabaya",
    "Bali",
    "Lombok",
    "Makassar", "Palu", "Manado", "Tarakan",
    "Ambon", "Manokwari", "Sorong", "Jayapura", "Merauke",
    "Kuala Lumpur","Singapore",
    "Nanjing",
    
  ];

  return (
    <section className="space-y-4">
      <SectionTitle icon="🌤️" title="Weather Widgets" />
    <Swiper
      modules={[Navigation, Autoplay, Pagination, Scrollbar]}
      spaceBetween={-250}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      navigation
      pagination={{ clickable: true }}
      scrollbar={{ draggable: true }}
      loop
      loopedSlides={cities.length}
      watchOverflow={true}
      centeredSlides={true}
      centerInsufficientSlides={true}
      breakpoints={{
        320: { slidesPerView: 1.2 },
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
      className="pb-4"
    >
      {cities.map((city) => (
        <SwiperSlide key={city} className="w-[250px] flex-shrink-0">
          <WeatherWidgetCustom city={city} />
        </SwiperSlide>
      ))}
    </Swiper>

    </section>
  );
}
