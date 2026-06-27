"use client";
import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import TrustBadges from '../components/sections/TrustBadges';
import HowItWorks from '../components/sections/HowItWorks';
import FeaturedProducts from '../components/sections/FeaturedProducts';
import Categories from '../components/sections/Categories';
import Testimonials from '../components/sections/Testimonials';
import CTASection from '../components/sections/CTASection';
import FAQSection from '../components/sections/FAQSection';

const HomePage = () => {
  return (
    <main>
      <HeroSection />
      <TrustBadges />
      <HowItWorks />
      <Categories />
      <FeaturedProducts />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </main>
  );
};

export default HomePage;
