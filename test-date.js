function DateInputBehavior(defaultValue) {
  let value = '';
  if (defaultValue) {
    const [y, m, d] = defaultValue.split('-');
    value = `${d}/${m}/${y}`;
  }

  const submittedParts = value.split('/');
  const submittedValue = submittedParts.length === 3 ? `${submittedParts[2]}-${submittedParts[1]}-${submittedParts[0]}` : defaultValue;

  console.log({ value, submittedValue });
}

DateInputBehavior("2026-04-05");
