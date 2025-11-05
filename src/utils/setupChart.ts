// utils/chartSetup.ts
import { Chart, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, LineController, BarController } from 'chart.js';

let registered = false;

export function setupChart() {
  if (registered) return;
  Chart.register(
    LineElement, BarElement, PointElement, CategoryScale, LinearScale,
    Title, Tooltip, Legend, LineController, BarController
  );
  registered = true;
}
