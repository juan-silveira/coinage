import React, { useEffect } from "react";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import useAuthStore from "@/store/authStore";

const BalanceSwitch = () => {
  const balanceHidden = useAuthStore((s) => s.maskBalances);
  const toggleMaskBalances = useAuthStore((s) => s.toggleMaskBalances);

  // Aplica ou remove a classe na raiz para mascarar todos elementos .balance
  useEffect(() => {
    const root = document.documentElement;
    if (balanceHidden) root.classList.add("mask-balances");
    else root.classList.remove("mask-balances");
  }, [balanceHidden]);

  return (
    <span>
      <Tooltip content={balanceHidden ? "Mostrar valores" : "Ocultar valores"}>
        <div
          className="lg:h-[32px] lg:w-[32px] lg:bg-slate-100 lg:dark:bg-slate-900 dark:text-white text-slate-900 cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center"
          onClick={toggleMaskBalances}
        >
          {balanceHidden ? (
            <Icon icon="heroicons:eye-slash" />
          ) : (
            <Icon icon="heroicons:eye" />
          )}
        </div>
      </Tooltip>
    </span>
  );
};

export default BalanceSwitch;
