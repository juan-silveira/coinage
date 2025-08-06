import React, { useState, useEffect } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Checkbox from "@/components/ui/Checkbox";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { loginUser } from "./store";
import { toast } from "react-toastify";

const schema = yup
  .object({
    email: yup.string().email("Email inválido").required("Email é obrigatório"),
    password: yup.string().required("Senha é obrigatória"),
  })
  .required();

const LoginForm = () => {
  const dispatch = useDispatch();
  const { isAuth, loading, error } = useSelector((state) => state.auth);
  const router = useRouter();
  
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuth) {
      router.push("/analytics");
    }
  }, [isAuth, router]);

  const onSubmit = async (data) => {
    try {
      await dispatch(loginUser({ email: data.email, password: data.password })).unwrap();
      // O redirecionamento será feito pelo useEffect quando isAuth mudar
    } catch (error) {
      // O erro já é tratado no store
      console.error("Erro no login:", error);
    }
  };

  const [checked, setChecked] = useState(false);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
      <Textinput
        name="email"
        label="email"
        defaultValue="dashcode@gmail.com"
        type="email"
        register={register}
        error={errors?.email}
      />
      <Textinput
        name="password"
        label="passwrod"
        type="password"
        defaultValue="dashcode"
        register={register}
        error={errors.password}
      />
      <div className="flex justify-between">
        <Checkbox
          value={checked}
          onChange={() => setChecked(!checked)}
          label="Keep me signed in"
        />
        <Link
          href="/forgot-password"
          className="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium"
        >
          Forgot Password?{" "}
        </Link>
      </div>

      <button 
        type="submit" 
        className="btn btn-dark block w-full text-center" 
        disabled={loading}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
};

export default LoginForm;
