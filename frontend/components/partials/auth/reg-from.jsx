import React, { useState } from "react";
import { toast } from "react-toastify";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Checkbox from "@/components/ui/Checkbox";
import { useDispatch, useSelector } from "react-redux";
import { handleRegister } from "./store";
import { validatePassword } from "@/utils/passwordValidation";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";

const schema = yup
  .object({
    name: yup.string().required("Name is Required"),
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(50, "Password shouldn't be more than 50 characters")
      .test(
        "strong-password",
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        (value) => {
          if (!value) return false;
          const validation = validatePassword(value);
          return validation.isValid;
        }
      )
      .required("Please enter password"),
    // confirm password
    confirmpassword: yup
      .string()
      .oneOf([yup.ref("password"), null], "Passwords must match")
      .required("Please confirm your password"),
  })
  .required();

const RegForm = () => {
  const dispatch = useDispatch();

  const [checked, setChecked] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  // Observe password value for real-time validation
  const watchPassword = watch("password", "");

  React.useEffect(() => {
    setPasswordValue(watchPassword);
  }, [watchPassword]);

  const router = useRouter();

  const onSubmit = (data) => {
    dispatch(handleRegister(data));
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  // Check if form can be submitted
  const canSubmit = () => {
    if (!isValid || !checked) return false;
    if (!passwordValue) return false;
    
    const passwordValidation = validatePassword(passwordValue);
    return passwordValidation.isValid;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 ">
      <Textinput
        name="name"
        label="name"
        type="text"
        placeholder=" Enter your name"
        register={register}
        error={errors.name}
      />{" "}
      <Textinput
        name="email"
        label="email"
        type="email"
        placeholder=" Enter your email"
        register={register}
        error={errors.email}
      />
      <div>
        <Textinput
          name="password"
          label="password"
          type="password"
          placeholder=" Enter your password"
          register={register}
          error={errors.password}
        />
        {passwordValue && (
          <PasswordStrengthIndicator password={passwordValue} />
        )}
      </div>
      <Textinput
        name="confirmpassword"
        label="confirm password"
        type="password"
        placeholder=" Confirm your password"
        register={register}
        error={errors.confirmpassword}
      />
      <Checkbox
        label="You accept our Terms and Conditions and Privacy Policy"
        value={checked}
        onChange={() => setChecked(!checked)}
      />
      <button 
        type="submit"
        disabled={!canSubmit()}
        className={`btn block w-full text-center transition-colors duration-200 ${
          canSubmit()
            ? 'btn-dark hover:bg-slate-700'
            : 'bg-gray-400 cursor-not-allowed text-white'
        }`}
      >
        Create an account
      </button>
    </form>
  );
};

export default RegForm;
