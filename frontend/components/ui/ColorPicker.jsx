import React, { useState, useRef } from "react";

const ColorPicker = ({
  label,
  value = "#000000",
  onChange,
  className = "",
  classLabel = "form-label",
  error,
  disabled = false,
  horizontal = false,
  name,
  id,
  description
}) => {
  const colorInputRef = useRef(null);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    if (onChange) {
      onChange(newColor);
    }
  };

  const handleColorBoxClick = () => {
    if (!disabled && colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  return (
    <div
      className={`fromGroup ${error ? "has-error" : ""} ${
        horizontal ? "flex" : ""
      }`}
    >
      {label && (
        <label
          htmlFor={id}
          className={`block capitalize ${classLabel} ${
            horizontal ? "flex-0 mr-6 md:w-[100px] w-[60px] break-words" : ""
          }`}
        >
          {label}
        </label>
      )}
      <div className={`relative ${horizontal ? "flex-1" : ""}`}>
        <div className="flex items-center space-x-3">
          {/* Color display box */}
          <div
            className={`w-12 h-10 border border-slate-300 dark:border-slate-600 rounded cursor-pointer transition-all duration-200 ${
              disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary-500"
            } ${className}`}
            style={{ backgroundColor: value }}
            onClick={handleColorBoxClick}
          />
          
          {/* Hidden color input */}
          <input
            ref={colorInputRef}
            type="color"
            value={value}
            onChange={handleColorChange}
            disabled={disabled}
            className="sr-only"
            id={id}
            name={name}
          />
          
          {/* Color value display */}
          <div className="flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                // Validate hex color format
                const hexColor = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
                  if (onChange) {
                    onChange(hexColor);
                  }
                }
              }}
              className={`form-control py-2 ${
                error ? "has-error" : ""
              } ${disabled ? "opacity-50" : ""}`}
              placeholder="#000000"
              disabled={disabled}
              maxLength={7}
            />
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-danger-500 block text-sm">
          {error.message || error}
        </div>
      )}
      
      {/* Description */}
      {description && (
        <span className="input-description mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </span>
      )}
    </div>
  );
};

export default ColorPicker;