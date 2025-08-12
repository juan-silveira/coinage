"use client";

import React from "react";
import { Icon as IconifyIcon } from "@iconify/react";
const Icon = ({ icon, className, width, rotate, hFlip, vFlip }) => {
  return (
    <>
      <IconifyIcon
        width={width}
        rotate={rotate}
        hFlip={hFlip}
        icon={icon}
        className={className}
        vFlip={vFlip}
      />
    </>
  );
};

export default Icon;
