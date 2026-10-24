import * as React from "react";

const LayerContext = React.createContext<HTMLElement | null>(null);

export const LayerProvider = LayerContext.Provider;

export const useLayer = () => React.useContext(LayerContext);
