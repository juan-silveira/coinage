import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import apiService from "@/services/api";

const schema = yup
  .object({
    currentPassword: yup.string().required("Senha atual é obrigatória"),
    newPassword: yup
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Nova senha deve conter maiúscula, minúscula, número e caractere especial"
      )
      .required("Nova senha é obrigatória"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("newPassword"), null], "Senhas devem ser iguais")
      .required("Confirmação de senha é obrigatória"),
  })
  .required();

const ChangePasswordForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await apiService.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (response.success) {
        toast.success("Senha alterada com sucesso!", {
          position: "top-right",
          autoClose: 2000,
        });
        
        // Limpar formulário
        reset();
        
        // Chamar callback de sucesso
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.message || "Erro ao alterar senha", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          Alterar Senha
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Como é seu primeiro acesso, é necessário alterar sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="currentPassword"
          label="Senha Atual"
          type="password"
          placeholder="Digite sua senha atual"
          register={register}
          error={errors.currentPassword}
        />

        <Textinput
          name="newPassword"
          label="Nova Senha"
          type="password"
          placeholder="Digite sua nova senha"
          register={register}
          error={errors.newPassword}
        />

        <Textinput
          name="confirmPassword"
          label="Confirmar Nova Senha"
          type="password"
          placeholder="Confirme sua nova senha"
          register={register}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          className="btn btn-dark block w-full text-center"
          disabled={loading}
        >
          {loading ? "Alterando..." : "Alterar Senha"}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordForm; 