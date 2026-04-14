"use client";
import { X } from "lucide-react";
import React, {
  cloneElement,
  createContext,
  FC,
  MouseEvent,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface ModalContextType {
  openName: string;
  open: (name: string) => void;
  close: () => void;
}

export const ModalContext = createContext<ModalContextType | null>(null);

export interface ModalContentProps {
  handleClose?: () => void;
}

interface ModalProps {
  children: ReactNode;
}

interface ModalCompoundComponent extends FC<ModalProps> {
  Open: FC<ModalOpenProps>;
  Window: FC<ModalWindowOwnProps>;
}

const Modal: ModalCompoundComponent = ({ children }) => {
  const [openName, setOpenName] = useState<string>("");

  const open = (name: string) => setOpenName(name);
  const close = () => setOpenName("");

  return (
    <ModalContext.Provider value={{ openName, open, close }}>
      {children}
    </ModalContext.Provider>
  );
};

interface ModalOpenProps {
  children: ReactElement<React.HTMLAttributes<HTMLElement>>;

  name: string;
}

const Open: FC<ModalOpenProps> = ({ children, name }) => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("Modal.Open must be used inside a Modal provider");

  return cloneElement(children, {
    onClick: () => ctx.open(name),
  });
};

interface ModalWindowOwnProps {
  children: ReactElement<ModalContentProps>;
  name: string;
  className?: string;
  buttonX?: boolean;
  onClose?: () => void;
}

const Window: FC<ModalWindowOwnProps> = ({
  children,
  name,
  className,
  buttonX = false,
  onClose,
}) => {
  const ctx = useContext(ModalContext);

  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!ctx)
    throw new Error("Modal.Window must be used inside a Modal provider");

  const { openName, close } = ctx;

  useEffect(() => {
    document.body.style.overflow = openName ? "hidden" : "auto";
  }, [openName]);

  const handleClose = () => {
    close();
    if (onClose) onClose();
  };

  function handleClickOutside(e: MouseEvent<HTMLDivElement>) {
    //  close when clicking the backdrop (the root div)
    if (e.target === containerRef.current) handleClose();
  }

  if (openName !== name) return null;

  // Guard for SSR (createPortal needs document)
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={containerRef}
      onClick={(e) => handleClickOutside(e)}
      className="fixed inset-0 z-[1000] h-dvh w-full bg-black/60 backdrop-blur-md"
    >
      <div
        className={` absolute top-[5%] left-1/2 border  -translate-x-1/2  rounded-lg px-2 py-1 shadow-sm ${className}`}
      >
        <button
          onClick={handleClose}
          className={`absolute top-5 right-8 translate-x-3 rounded-sm border-none bg-transparent p-1 transition-all duration-200 hover:bg-gray-700 ${
            buttonX ? "" : "hidden"
          }`}
        >
          <X
            className="h-6 w-6 text-gray-500"
            style={{ color: "var(--color-grey-500)" }}
          />
        </button>

        {/* Clone the child and inject handleClose (typed as ModalContentProps) */}
        <div>{cloneElement(children, { handleClose })}</div>
      </div>
    </div>,
    document.body
  );
};

Modal.Open = Open;
Modal.Window = Window;

export default Modal;
