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
import ChangePasswordForm from "./change-password-form";

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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loginData, setLoginData] = useState(null);
  
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
    console.log("LoginForm useEffect: isAuth mudou para:", isAuth);
    if (isAuth) {
      console.log("LoginForm: Redirecionando para /banking");
      router.push("/banking");
    }
  }, [isAuth, router]);

  const onSubmit = async (data) => {
    console.log("Tentando fazer login com:", data.email);
    try {
      const result = await dispatch(loginUser({ email: data.email, password: data.password })).unwrap();
      console.log("Login bem-sucedido:", result);
      
      // Verificar se é primeiro acesso
      if (result.isFirstAccess) {
        setLoginData(data);
        setShowChangePassword(true);
      }
      // Se não for primeiro acesso, o redirecionamento será feito pelo useEffect
    } catch (error) {
      // O erro já é tratado no store
      console.error("Erro no login:", error);
    }
  };

  const [checked, setChecked] = useState(false);

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false);
    setLoginData(null);
    // Fazer login novamente com a nova senha
    if (loginData) {
      dispatch(loginUser({ email: loginData.email, password: loginData.password }));
    }
  };

  // Se deve mostrar o formulário de alteração de senha
  if (showChangePassword) {
    return <ChangePasswordForm onSuccess={handlePasswordChangeSuccess} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
                           <Textinput
          name="email"
          label="email"
          defaultValue="ivan.alberton@navi.inf.br"
          type="email"
          register={register}
          error={errors?.email}
        />
        <Textinput
          name="password"
          label="password"
          type="password"
          defaultValue="N@vi@2025"
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
