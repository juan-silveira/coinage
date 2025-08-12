"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
const Accordion = ({ items, className = "space-y-5" }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          className={`accordion shadow-base dark:shadow-none rounded-md border transition-all duration-200 ${
            activeIndex === index 
              ? "border-primary-200 shadow-lg" 
              : "border-gray-200 hover:border-gray-300"
          }`}
          key={index}
        >
          <div
            className={`flex justify-between cursor-pointer transition duration-200 font-medium w-full text-start text-base px-8 py-4 ${
              activeIndex === index
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 rounded-t-md border-b border-primary-200"
                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
            }`}
            onClick={() => toggleAccordion(index)}
          >
            <span>{item.title} </span>
            <span
              className={`text-slate-900 dark:text-white text-[22px] transition-all duration-300 h-5 ${
                activeIndex === index ? "rotate-180 transform text-primary-600" : ""
              }`}
            >
              <Icon icon="heroicons-outline:chevron-down" />
            </span>
          </div>

          {activeIndex === index && (
            <div
              className="text-sm text-slate-600 font-normal bg-white dark:bg-slate-900 dark:text-slate-300 rounded-b-md border-t-0"
            >
              <div
                className="px-8 py-6"
                dangerouslySetInnerHTML={{ __html: item.content }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
export default Accordion;
