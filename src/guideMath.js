export const texNumber = (value, digits = 2) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, useGrouping: false }).format(value).replaceAll(',', '{,}');
export const quantity = (value, unit = '', digits = 2) => `${texNumber(value, digits)}${unit ? String.raw`\,${unit}` : ''}`;
export const texFrequency = value => value >= 1e6 ? quantity(value / 1e6, String.raw`\mathrm{MHz}`) : value >= 1e3 ? quantity(value / 1e3, String.raw`\mathrm{kHz}`) : quantity(value, String.raw`\mathrm{Hz}`);
export function deriveEquation(example) {
  if (example.maxNoise) return String.raw`\begin{aligned}g_{m,n}&\ge\frac{4kT\gamma}{e_n^2}\\g_{m,B}&\ge2\pi A_{\mathrm{req}}f_{\min}C_L\\g_{m,\min}&=\max(g_{m,n},g_{m,B})\end{aligned}`;
  if (example.objective === 'area') return String.raw`g_{m,\min}\ge2\pi A_{\mathrm{req}}f_{\min}C_L\qquad\left(\frac{g_m}{I_D}\right)_{\min}\ge\frac{g_{m,\min}}{I_{D,\max}}`;
  return String.raw`A_0f_{-3\mathrm{dB}}=\frac{g_m}{2\pi C_{\mathrm{tot}}}\quad\Longrightarrow\quad g_{m,\min}\ge2\pi A_{\mathrm{req}}f_{\min}C_L`;
}
export const scaleEquation = String.raw`\begin{aligned}I_D&=\max(I_{D,A},I_{D,B},I_{D,n})\\g_m&=\left(\frac{g_m}{I_D}\right)I_D\\W&=\frac{I_D}{J_D},\qquad J_D=\frac{I_D}{W}\end{aligned}`;
export const poleEquation = String.raw`\begin{aligned}C_{\mathrm{out}}&=W\left(\frac{C_{\mathrm{out}}}{W}\right)\\f_{-3\mathrm{dB}}&=\frac{1}{2\pi(r_o\parallel R_L)(C_L+C_{\mathrm{out}})}\end{aligned}`;
export function designEquation(row, point = row.point) {
  return String.raw`\begin{aligned}L&=${quantity(row.design.length, String.raw`\mu\mathrm m`)}\\\frac{g_m}{I_D}&=${quantity(row.design.efficiency, String.raw`\mathrm{V^{-1}}`)}\\I_D&=${quantity(point.current, String.raw`\mu\mathrm A`, 3)}\\W&=${quantity(point.width, String.raw`\mu\mathrm m`, 3)}\end{aligned}`;
}
