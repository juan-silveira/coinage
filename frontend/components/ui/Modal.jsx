import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import Icon from "@/components/ui/Icon";
import useDarkmode from "@/hooks/useDarkMode";

const Modal = ({
  activeModal,
  onClose,
  noFade,
  disableBackdrop,
  className = "max-w-xl",
  children,
  footerContent,
  centered,
  scrollContent,
  themeClass = "bg-slate-900 dark:bg-slate-800 dark:border-b dark:border-slate-700",
  title = "Basic Modal",
  uncontrol,
  label = "Basic Modal",
  labelClass,
  ref,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isDark] = useDarkmode();

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = () => {
    setShowModal(!showModal);
  };
  const returnNull = () => {
    return null;
  };

  // Classes baseadas no tema atual
  const modalClasses = {
    backdrop: isDark ? "bg-slate-900/70" : "bg-slate-900/50",
    panel: isDark 
      ? "bg-slate-800 border border-slate-700" 
      : "bg-white border border-slate-200",
    header: isDark 
      ? "bg-slate-700 border-b border-slate-600 text-white" 
      : "bg-slate-100 border-b border-slate-200 text-slate-900",
    headerTitle: isDark 
      ? "text-white font-semibold" 
      : "text-slate-900 font-semibold",
    content: isDark ? "text-slate-300" : "text-slate-700",
    footer: isDark 
      ? "border-t border-slate-600 bg-slate-700" 
      : "border-t border-slate-200 bg-slate-50",
    closeButton: isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
  };

  return (
    <>
      {uncontrol ? (
        <>
          <button
            type="button"
            onClick={openModal}
            className={`btn ${labelClass}`}
          >
            {label}
          </button>
          <Transition appear show={showModal} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-[99999]"
              onClose={!disableBackdrop ? closeModal : returnNull}
            >
              {!disableBackdrop && (
                <Transition.Child
                  as={Fragment}
                  enter={noFade ? "" : "duration-300 ease-out"}
                  enterFrom={noFade ? "" : "opacity-0"}
                  enterTo={noFade ? "" : "opacity-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100"}
                  leaveTo={noFade ? "" : "opacity-0"}
                >
                  <div className={`fixed inset-0 ${modalClasses.backdrop} backdrop-filter backdrop-blur-sm`} />
                </Transition.Child>
              )}

              <div className="fixed inset-0 overflow-y-auto">
                <div
                  className={`flex min-h-full justify-center text-center p-6 ${
                    centered ? "items-center" : "items-start "
                  }`}
                >
                  <Transition.Child
                    as={Fragment}
                    enter={noFade ? "" : "duration-300  ease-out"}
                    enterFrom={noFade ? "" : "opacity-0 scale-95"}
                    enterTo={noFade ? "" : "opacity-100 scale-100"}
                    leave={noFade ? "" : "duration-200 ease-in"}
                    leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                    leaveTo={noFade ? "" : "opacity-0 scale-95"}
                  >
                    <Dialog.Panel
                      className={`w-full transform overflow-hidden rounded-md shadow-xl transition-all ${modalClasses.panel} ${className}`}
                    >
                      <div
                        className={`relative overflow-hidden py-4 px-5 flex justify-between ${modalClasses.header}`}
                      >
                        <h2 className={`capitalize leading-6 tracking-wider text-base ${modalClasses.headerTitle}`}>
                          {title}
                        </h2>
                        <button onClick={closeModal} className={`text-[22px] ${modalClasses.closeButton}`}>
                          <Icon icon="heroicons-outline:x" />
                        </button>
                      </div>
                      <div
                        className={`px-6 py-8 ${modalClasses.content} ${
                          scrollContent ? "overflow-y-auto max-h-[400px]" : ""
                        }`}
                      >
                        {children}
                      </div>
                      {footerContent && (
                        <div className={`px-4 py-3 flex justify-end space-x-3 ${modalClasses.footer}`}>
                          {footerContent}
                        </div>
                      )}
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </>
      ) : (
        <Transition appear show={activeModal} as={Fragment}>
          <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
            {!disableBackdrop && (
              <Transition.Child
                as={Fragment}
                enter={noFade ? "" : "duration-300 ease-out"}
                enterFrom={noFade ? "" : "opacity-0"}
                enterTo={noFade ? "" : "opacity-100"}
                leave={noFade ? "" : "duration-200 ease-in"}
                leaveFrom={noFade ? "" : "opacity-100"}
                leaveTo={noFade ? "" : "opacity-0"}
              >
                <div className={`fixed inset-0 ${modalClasses.backdrop} backdrop-filter backdrop-blur-sm`} />
              </Transition.Child>
            )}

            <div className="fixed inset-0 overflow-y-auto">
              <div
                className={`flex min-h-full justify-center text-center p-6 ${
                  centered ? "items-center" : "items-start "
                }`}
              >
                <Transition.Child
                  as={Fragment}
                  enter={noFade ? "" : "duration-300  ease-out"}
                  enterFrom={noFade ? "" : "opacity-0 scale-95"}
                  enterTo={noFade ? "" : "opacity-100 scale-100"}
                  leave={noFade ? "" : "duration-200 ease-in"}
                  leaveFrom={noFade ? "" : "opacity-100 scale-100"}
                  leaveTo={noFade ? "" : "opacity-0 scale-95"}
                >
                  <Dialog.Panel
                    className={`w-full transform overflow-hidden rounded-md shadow-xl transition-all ${modalClasses.panel} ${className}`}
                  >
                    <div
                      className={`relative overflow-hidden py-4 px-5 flex justify-between ${modalClasses.header}`}
                    >
                      <h2 className={`capitalize leading-6 tracking-wider text-base ${modalClasses.headerTitle}`}>
                        {title}
                      </h2>
                      <button onClick={onClose} className={`text-[22px] ${modalClasses.closeButton}`}>
                        <Icon icon="heroicons-outline:x" />
                      </button>
                    </div>
                    <div
                      className={`px-6 py-8 ${modalClasses.content} ${
                        scrollContent ? "overflow-y-auto max-h-[400px]" : ""
                      }`}
                    >
                      {children}
                    </div>
                    {footerContent && (
                      <div className={`px-4 py-3 flex justify-end space-x-3 ${modalClasses.footer}`}>
                        {footerContent}
                      </div>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
};

export default Modal;
