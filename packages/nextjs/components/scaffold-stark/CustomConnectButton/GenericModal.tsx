import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const GenericModal = ({
  children,
  className = "modal-box modal-border bg-modal rounded-[8px] border flex flex-col relative w-full max-w-xs p-6",
  modalId,
}: {
  children: React.ReactNode;
  className?: string;
  modalId: string;
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <label htmlFor={modalId} className="modal backdrop-blur-sm cursor-pointer z-[9999] fixed inset-0 flex items-center justify-center bg-black/60">
      <label className={`${className} z-[10000]`} style={{ minHeight: "auto" }}>
        {/* dummy input to capture event onclick on modal box */}
        <input className="h-0 w-0 absolute top-0 left-0" aria-hidden="true" tabIndex={-1} />
        {children}
      </label>
    </label>,
    document.body
  );
};

export default GenericModal;
