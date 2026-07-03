function silenceExpectedConsoleErrors(matchers) {
  const original = console.error;
  const compiled = (matchers || []).map((m) =>
    m instanceof RegExp ? m : new RegExp(String(m), "i")
  );

  const spy = jest.spyOn(console, "error").mockImplementation((...args) => {
    const message = args
      .map((a) => {
        if (a instanceof Error) return a.message;
        if (typeof a === "string") return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");

    const isExpected = compiled.some((rx) => rx.test(message));
    if (!isExpected) {
      original(...args);
    }
  });

  return () => spy.mockRestore();
}

module.exports = { silenceExpectedConsoleErrors };
