import { render } from "@testing-library/react";
import React from "react";
import { TestWrapper } from "../../../vitest.setup";
import CategoryTreeItem from "@/components/admin/CategoryTreeItem";
import Breadcrumb from "@/components/ui/Breadcrumb";
import QuestionFormLayout from "@/components/admin/QuestionFormLayout";

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

// Targeted smoke renders with minimal props to avoid runtime errors
test("renders CategoryTreeItem with minimal props", () => {
  const node = { _isFirst: false, _isLast: false, label: "Node", children: [] };
  render(
    <TestWrapper>
      <CategoryTreeItem
        node={node}
        onEdit={() => {}}
        onDelete={() => {}}
        onAddChild={() => {}}
        onReorder={() => {}}
      />
    </TestWrapper>
  );
});

test("renders Breadcrumb with minimal items", () => {
  render(
    <TestWrapper>
      <Breadcrumb items={[{ label: "Home" }, { label: "Page" }]} />
    </TestWrapper>
  );
});

test("renders QuestionFormLayout with minimal props", () => {
  const form = { category: "", subcategory: "", answers: [], explanations: [], choiceImages: [] };
  render(
    <TestWrapper>
      <QuestionFormLayout form={form} onChange={() => {}} onSubmit={() => {}} categoriesTree={[]} />
    </TestWrapper>
  );
});
