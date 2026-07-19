import { readFile } from "node:fs/promises";

import { getComponentContract, getComponentExample } from "../apps/showroom/src/data/component-contracts.ts";

const manifest = JSON.parse(await readFile("apps/showroom/src/data/components.json", "utf8"));
const components = manifest.flatMap((group) => group.components);
const adapters = ["react", "svelte", "html"];

for (const component of components) {
  const contract = getComponentContract(component.name);
  if (contract.parameters.length === 0) {
    throw new Error(`${component.name} has no parameter documentation`);
  }
  if (contract.parameters.length !== contract.props.length) {
    throw new Error(`${component.name} parameter summary and detailed documentation are out of sync`);
  }

  const parameterNames = new Set();
  for (const parameter of contract.parameters) {
    if (parameterNames.has(parameter.name)) {
      throw new Error(`${component.name}.${parameter.name} is documented more than once`);
    }
    parameterNames.add(parameter.name);
    for (const field of ["type", "defaultValue", "description", "example"]) {
      if (!parameter[field]?.trim()) {
        throw new Error(`${component.name}.${parameter.name} is missing ${field}`);
      }
    }
    if (parameter.example.startsWith("see complete")) {
      throw new Error(`${component.name}.${parameter.name} needs a concrete parameter example`);
    }
    if (parameter.adapters.length === 0) {
      throw new Error(`${component.name}.${parameter.name} is not assigned to an adapter`);
    }
  }

  for (const adapter of adapters) {
    const example = getComponentExample(component.name, adapter, component.interactive);
    if (example.split("\n").length < 6) {
      throw new Error(`${component.name} ${adapter} example is not detailed enough`);
    }
    if (!example.includes(`Complete ${component.name} parameter reference`)) {
      throw new Error(`${component.name} ${adapter} example has no parameter reference`);
    }
    const adapterName = `${adapter[0].toUpperCase()}${adapter.slice(1)}`;
    for (const parameter of contract.parameters.filter(({ adapters: targets }) =>
      targets.includes(adapterName),
    )) {
      if (!example.includes(parameter.name)) {
        throw new Error(`${component.name}.${parameter.name} is missing from the ${adapter} example`);
      }
    }
  }
}

console.log(
  `${components.length} components have complete parameter tables and detailed React, Svelte, and HTML examples.`,
);
