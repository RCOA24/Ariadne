export function WorkspacePlaceholder({
  title,
  text,
}: {
  readonly title: string;
  readonly text: string;
}) {
  return (
    <section className="py-7">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <div className="mt-5 rounded-xl border border-slate-800 p-6 text-slate-400">
        {text}
      </div>
    </section>
  );
}
