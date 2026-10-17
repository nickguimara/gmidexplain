import React from 'react';

const fmt = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value);

// Three-terminal MOS symbol. External drain/source pins are always (x,y±32),
// and the gate pin is (x±40,y). The channel and gate share the same center.
// Source arrows point out of the NMOS and into the PMOS channel.
// The body connection is implicit (source-tied).
export function MosSymbol({ x, y, pmos = false, facing = 'left', name, selected = false }) {
  const side = facing === 'left' ? -1 : 1;
  const channel = x + side * 12;
  const gate = x + side * 24;
  const sourceY = y + (pmos ? -16 : 16);
  const arrowDirection = pmos ? side : -side;
  const arrowTip = x + side * (pmos ? 10 : 2);
  return <g data-mos={name} data-type={pmos ? 'pmos' : 'nmos'} data-sizing-target={selected ? 'true' : undefined}>
    {selected && <>
      <title>{name}: transistor cujo gm/ID e L estão sendo dimensionados</title>
      <rect className="sizing-target-halo" x={side < 0 ? x - 48 : x - 30} y={y - 40} width="78" height="80" rx="9" />
    </>}
    <path d={`M${x} ${y - 32}v16H${channel}v32H${x}v16M${gate} ${y - 17}v34`} />
    <path d={`M${x + side * 40} ${y}H${gate}`} />
    <path data-source-arrow="" d={`M${arrowTip - arrowDirection * 4} ${sourceY - 3}L${arrowTip} ${sourceY}L${arrowTip - arrowDirection * 4} ${sourceY + 3}`} />
    <text x={x - side * 9} y={y + 4} className="circuit-label">{name}</text>
  </g>;
}

function Ground({ x, y }) {
  return <path d={`M${x} ${y}v6m-11 0h22m-18 5h14m-10 5h6`} />;
}

function Junction({ x, y }) {
  return <circle cx={x} cy={y} r="2.6" fill="#42536b" />;
}

function Diagram({ viewBox, label, children }) {
  return <svg className="schematic circuit-diagram" viewBox={viewBox} role="img" aria-label={label}>
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</g>
  </svg>;
}

export function MirrorSchematic({ current }) {
  return <Diagram viewBox="0 0 340 222" label="Espelho NMOS 1:1. M1 à esquerda, espelhado horizontalmente, tem dreno ligado aos gates comuns. O ramo de saída de M2 sobe verticalmente e é identificado como I_out. As fontes compartilham o terra.">
    <path data-wire="reference-supply" d="M90 26h40M110 26v16" />
    <circle cx="110" cy="60" r="18" />
    <path d="M110 50v20m-5-6 5 6 5-6" />
    <path data-wire="reference-drain" d="M110 78v26" />
    <MosSymbol x={110} y={142} facing="right" name="M₁" selected />
    <MosSymbol x={230} y={142} name="M₂" selected />
    <path data-wire="diode-feedback" d="M110 104h60v38" />
    <path data-wire="common-gates" d="M150 142h40" />
    <path data-wire="output" d="M230 110V42" />
    <path d="M110 104v6M110 174v20h120v-20" />
    <Junction x={110} y={104} /><Junction x={170} y={142} />
    <Junction x={170} y={194} /><Ground x={170} y={194} />
    <text x="110" y="18" textAnchor="middle" className="circuit-label">Vᴅᴅ = 1,2 V</text>
    <text x="84" y="58" textAnchor="end" className="circuit-label">I_ref = {fmt(current)} µA</text>
    <text x="84" y="73" textAnchor="end" className="circuit-note">fonte ideal</text>
    <text x="241" y="51" className="circuit-signal">I_out</text>
    <text x="241" y="67" className="circuit-note">≈ {fmt(current)} µA</text>
  </Diagram>;
}

export function ActiveSchematic({ current }) {
  return <Diagram viewBox="0 0 320 274" label="Fonte comum M1 NMOS com um PMOS ML como carga ativa. Fontes em terra e VDD, drenos unidos na saída. Gate de ML polarizado por V_bias. Capacitor CL entre saída e terra.">
    <MosSymbol x={172} y={78} pmos name="M_L" selected />
    <MosSymbol x={172} y={194} name="M₁" />
    <path data-wire="load-supply" d="M152 26h40M172 26v20" />
    <path data-wire="load-bias" d="M52 78h80" />
    <path data-wire="input" d="M52 194h80" />
    <path data-wire="output" d="M172 110v52M172 136h82v25" />
    <Junction x={172} y={136} />
    {/* Separate capacitor plates; the lower plate alone connects to ground. */}
    <path data-capacitor="CL" d="M244 161h20M244 168h20M254 168v23" />
    <Ground x={254} y={191} />
    <path d="M172 226v16" /><Ground x={172} y={242} />
    <text x="172" y="18" textAnchor="middle" className="circuit-label">Vᴅᴅ = 1,2 V</text>
    <text x="52" y="69" className="circuit-label">V_bias</text>
    <text x="52" y="185" className="circuit-signal">v_in</text>
    <text x="203" y="127" className="circuit-signal">v_out</text>
    <text x="271" y="169" className="circuit-label">C_L</text>
    <text x="30" y="253" className="circuit-note">I_D = {fmt(current)} µA</text>
  </Diagram>;
}

export function CommonSourceSchematic({ current, vds }) {
  return <Diagram viewBox="0 0 320 244" label="Fonte comum NMOS M1 destacado em laranja: gm/ID e L selecionam este transistor. Fonte de corrente ideal no dreno e fonte ao terra; entrada no gate e saída no dreno.">
    <path d="M128 24h40M148 24v14" />
    <circle cx="148" cy="56" r="18" />
    <path d="M148 46v20m-5-6 5 6 5-6M148 74v44M148 96h94" />
    <MosSymbol x={148} y={150} name="M₁" selected />
    <path d="M52 150h56M148 182v24" />
    <Ground x={148} y={206} /><Junction x={148} y={96} />
    <text x="148" y="17" textAnchor="middle" className="circuit-label">Vᴅᴅ = 1,2 V</text>
    <text x="176" y="53" className="circuit-label">I_D = {fmt(current)} µA</text>
    <text x="176" y="69" className="circuit-note">fonte ideal</text>
    <text x="52" y="141" className="circuit-signal">v_in</text>
    <text x="247" y="92" className="circuit-signal">v_out</text>
    <text x="28" y="230" className="circuit-note">V_DS = {fmt(vds)} V · M₁ em dimensionamento</text>
  </Diagram>;
}

export function DiffSchematic({ current }) {
  return <Diagram viewBox="0 0 380 378" label="Par diferencial: M1 e M2 destacados em laranja são os transistores de entrada cujo gm/ID e L estão sendo dimensionados. M3/M4 são as cargas PMOS, com gates unidos horizontalmente. Saída à direita. A cauda M5 e as cargas não variam com o slider.">
    <MosSymbol x={118} y={78} pmos facing="right" name="M₃" />
    <MosSymbol x={262} y={78} pmos name="M₄" />
    <MosSymbol x={118} y={208} name="M₁" selected />
    <MosSymbol x={262} y={208} facing="right" name="M₂" selected />
    <MosSymbol x={190} y={310} name="M₅" />
    <path data-wire="load-supply" d="M118 46V26h144v20" />
    {/* Straight gate bus; M3 drain feedback joins its midpoint. */}
    <path data-wire="common-load-gates" d="M158 78h64" />
    <path data-wire="diode-feedback" d="M118 110v28h72V78" />
    <Junction x={190} y={78} /><Junction x={118} y={138} />
    <path data-wire="reference-drain" d="M118 138v38" />
    <path data-wire="output" d="M262 110v66M262 146h62" />
    <Junction x={262} y={146} />
    <path data-wire="input-positive" d="M28 208h50" />
    <path data-wire="input-negative" d="M302 208h50" />
    <path data-wire="common-sources" d="M118 240v20h144v-20M190 260v18" />
    <Junction x={190} y={260} />
    <path data-wire="tail-bias" d="M64 310h86" />
    <path d="M190 342v10" /><Ground x={190} y={352} />
    <text x="190" y="18" textAnchor="middle" className="circuit-label">Vᴅᴅ = 1,2 V</text>
    <text x="285" y="137" className="circuit-signal">v_out</text>
    <text x="28" y="199" className="circuit-signal">v_in+</text>
    <text x="314" y="199" className="circuit-signal">v_in−</text>
    <text x="64" y="301" className="circuit-label">V_bias</text>
    <text x="24" y="362" className="circuit-note">I_cauda = {fmt(2 * current)} µA</text>
    <text x="215" y="362" className="circuit-target-note">Em dimensionamento: M₁/M₂</text>
  </Diagram>;
}
