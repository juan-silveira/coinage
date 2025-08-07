import React, { useState } from "react";
import Icon from "@/components/ui/Icon";

const SimpleInput = ({
  type = "text",
  label,
  placeholder = "",
  className = "",
  name,
  value,
  onChange,
  error,
  disabled = false,
  id,
  required = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type === "password" && showPassword ? "text" : type}
          name={name}
          value={value}
          onChange={onChange}
          className={`form-control py-2 ${
            error ? "border-red-500" : "border-slate-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          placeholder={placeholder}
          disabled={disabled}
          id={id}
          {...rest}
        />
        
        {/* Password toggle icon */}
        {type === "password" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
              type="button"
              onClick={handlePasswordToggle}
              className="text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <Icon icon="heroicons-outline:eye-off" />
              ) : (
                <Icon icon="heroicons-outline:eye" />
              )}
            </button>
          </div>
        )}
        
        {/* Error icon */}
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Icon icon="heroicons-outline:information-circle" className="text-red-500" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
    </div>
  );
};

export default SimpleInput;
