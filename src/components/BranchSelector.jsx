"use client";

import { useBranch } from "@/src/hooks/useBranchContext";

const BRANCH_STYLES = [
  {
    gradient: "from-indigo-500 to-violet-600",
    ring: "ring-indigo-400",
    icon: "🏪",
  },
  {
    gradient: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-400",
    icon: "📱",
  },
  {
    gradient: "from-amber-500 to-orange-600",
    ring: "ring-amber-400",
    icon: "🔧",
  },
  {
    gradient: "from-rose-500 to-pink-600",
    ring: "ring-rose-400",
    icon: "⭐",
  },
];

export default function BranchSelector() {
  const { activeBranch, branches, setActiveBranch, canSwitchBranch } = useBranch();

  if (!canSwitchBranch || branches.length <= 1) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Selecciona sucursal</h2>
        <p className="text-sm text-slate-500">
          Elige la sucursal con la que deseas trabajar. Los datos de cada módulo
          cambiarán según tu selección.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch, index) => {
          const style = BRANCH_STYLES[index % BRANCH_STYLES.length];
          const isActive = activeBranch?.id === branch.id;

          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => setActiveBranch(branch)}
              className={`group relative overflow-hidden rounded-2xl p-1 text-left transition-all ${
                isActive
                  ? `ring-4 ${style.ring} shadow-lg scale-[1.02]`
                  : "ring-1 ring-slate-200 hover:ring-2 hover:ring-slate-300 hover:shadow-md"
              }`}
            >
              <div
                className={`rounded-xl bg-gradient-to-br ${style.gradient} p-5 text-white`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{style.icon}</span>
                  {isActive && (
                    <span className="rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                      Activa
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-bold">{branch.name}</h3>
                {branch.address && (
                  <p className="mt-1 text-sm text-white/85">{branch.address}</p>
                )}
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-white/70">
                  {isActive ? "Trabajando aquí" : "Clic para seleccionar"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
