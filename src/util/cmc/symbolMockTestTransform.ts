// try to mock real asset value for test assets
export const symbolMockTestTransform = (s: string) =>
  s.replace(/_(TEST)?.*/, "");
