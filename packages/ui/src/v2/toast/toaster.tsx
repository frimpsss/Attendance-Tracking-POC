import { Toaster as SonnerToaster } from "sonner";

import { toastClassNames } from "./styles";

function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      toastOptions={{ unstyled: true, classNames: toastClassNames }}
    />
  );
}

export { Toaster };
