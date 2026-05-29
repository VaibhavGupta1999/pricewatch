"use client";

import React, { memo } from "react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

interface SparklineProps {
  data: { val: number }[];
}

const Sparkline = memo(function Sparkline({ data }: SparklineProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Line 
          type="monotone" 
          dataKey="val" 
          stroke="#10b981" 
          strokeWidth={2} 
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

export default Sparkline;
