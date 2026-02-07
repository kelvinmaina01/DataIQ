export function StudentBanner() {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 mb-12 sm:mb-16 animate-fade-in">
      <div className="bg-secondary/30 border-2 border-primary/20 rounded-2xl p-6 sm:p-8 text-center hover:shadow-xl transition-all hover:scale-[1.02]">
        <div className="text-sm font-semibold text-muted-foreground mb-2">For students & researchers</div>
        <div className="text-xl sm:text-2xl font-bold mb-4 text-foreground">
          Pro at <span className="text-primary">$3.90/mo</span>— 90% off with .edu
        </div>
        <button className="bg-primary text-primary-foreground px-8 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all hover:scale-105 shadow-md active:scale-95">
          Verify Education Status
        </button>
      </div>
    </section>
  );
}