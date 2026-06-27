import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { faqData } from '@/config/static-data';

const FAQSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-[#4A4A68] text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
            Everything you need to know about our products & services
          </p>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqData.map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`} className="bg-[#FAFAFA] rounded-xl border border-gray-100 px-6">
              <AccordionTrigger className="text-left text-[#1A1A2E] font-semibold text-sm py-5 hover:no-underline" style={{ fontFamily: 'Inter, sans-serif' }}>
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[#4A4A68] text-sm leading-relaxed pb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
