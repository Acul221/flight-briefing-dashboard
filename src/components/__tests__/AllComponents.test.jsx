import { render } from "@testing-library/react";
import React from "react";
import { TestWrapper } from "../../../vitest.setup";

// import otomatis semua komponen di folder components
const modules = import.meta.glob("../**/*.jsx", { eager: true });

Object.entries(modules).forEach(([fileName, module]) => {
  const Component = module.default;

  if (Component) {
    test(`renders ${fileName} without crashing`, () => {
      render(
        <TestWrapper>
          <Component />
        </TestWrapper>
      );
    });
  }
});
