import { toast as sonner, type ExternalToast } from "sonner";

import { toastClassNames } from "./styles";

type Message = Parameters<typeof sonner>[0];

const styled = (options?: ExternalToast): ExternalToast => ({
  unstyled: true,
  closeButton: false,
  ...options,
  classNames: { ...toastClassNames, ...options?.classNames },
});

const toast = Object.assign((message: Message, options?: ExternalToast) => sonner(message, styled(options)), {
  message: (message: Message, options?: ExternalToast) => sonner(message, styled(options)),
  success: (message: Message, options?: ExternalToast) => sonner.success(message, styled(options)),
  error: (message: Message, options?: ExternalToast) => sonner.error(message, styled(options)),
  warning: (message: Message, options?: ExternalToast) => sonner.warning(message, styled(options)),
  info: (message: Message, options?: ExternalToast) => sonner.info(message, styled(options)),
  loading: (message: Message, options?: ExternalToast) => sonner.loading(message, styled(options)),
  dismiss: sonner.dismiss,
});

export { toast };
