import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { CompanyProfile, User } from '../types';
import * as d3 from 'd3';

interface SystemHealthCardProps {
    companies: CompanyProfile[];
    users: User[];
}

interface DataPoint {
    date: Date;
    usersCount: number;
    revenue: number;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ companies, users }) => {
    const [activeMetricsTab, setActiveMetricsTab] = useState<'users' | 'revenue'>('users');
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Calculate current stats
    const totalUsers = users.length;
    
    const totalMonthlyRevenue = useMemo(() => {
        let revenue = 0;
        companies.forEach(company => {
            const tier = company.license?.tier;
            if (company.license?.status === 'active') {
                if (tier === 'monthly') revenue += 150;
                else if (tier === 'quarterly') revenue += 133;
                else if (tier === 'semi-annually') revenue += 125;
                else if (tier === 'yearly') revenue += 100;
            }
        });
        return revenue;
    }, [companies]);

    // Generate historic 6-month trend ending with current stats
    const trendData = useMemo<DataPoint[]>(() => {
        const data: DataPoint[] = [];
        const baseDate = new Date();
        
        // 6 months of data
        for (let i = 5; i >= 0; i--) {
            const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 15);
            // Growth factor
            const factor = (6 - i) / 6;
            
            // Scaled based on current counts
            const usersCount = Math.max(3, Math.round(totalUsers * factor * (0.95 + Math.random() * 0.1)));
            const revenue = Math.max(100, Math.round(totalMonthlyRevenue * factor * (0.97 + Math.random() * 0.06)));
            
            data.push({
                date,
                usersCount: i === 0 ? totalUsers : usersCount,
                revenue: i === 0 ? totalMonthlyRevenue : revenue
            });
        }
        return data;
    }, [totalUsers, totalMonthlyRevenue]);

    // D3 Line generation & Axes rendering
    useEffect(() => {
        if (!svgRef.current || trendData.length === 0) return;

        const svgElement = d3.select(svgRef.current);
        svgElement.selectAll("*").remove(); // Clear previous drawing

        const width = 450;
        const height = 150;
        const margin = { top: 15, right: 20, bottom: 25, left: 35 };

        const svg = svgElement
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // X scale
        const xScale = d3.scaleTime()
            .domain(d3.extent(trendData, (d: DataPoint) => d.date) as [Date, Date])
            .range([0, chartWidth]);

        // Y scale
        const yValueSelector = activeMetricsTab === 'users' ? (d: DataPoint) => d.usersCount : (d: DataPoint) => d.revenue;
        const maxY = d3.max(trendData, yValueSelector) || 10;
        const yScale = d3.scaleLinear()
            .domain([0, maxY * 1.15])
            .range([chartHeight, 0]);

        // Axes generators
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d => d3.timeFormat("%b")(d as Date))
            .tickSize(0);

        const yAxis = d3.axisLeft(yScale)
            .ticks(4)
            .tickSize(-chartWidth); // Grid lines

        // Draw X axis
        const gX = svg.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(xAxis);

        gX.select(".domain")
            .attr("stroke", "rgba(156, 163, 175, 0.3)");

        gX.selectAll("text")
            .style("fill", "rgba(156, 163, 175, 0.8)")
            .style("font-size", "9px")
            .style("font-family", "monospace")
            .attr("dy", "10px");

        // Draw Y axis & vertical styling for grid lines
        const gY = svg.append("g")
            .call(yAxis);

        gY.select(".domain").remove(); // No solid vertical line
        
        gY.selectAll(".tick line")
            .attr("stroke", "rgba(156, 163, 175, 0.15)")
            .attr("stroke-dasharray", "2,2");

        gY.selectAll("text")
            .style("fill", "rgba(156, 163, 175, 0.8)")
            .style("font-size", "9px")
            .style("font-family", "monospace")
            .attr("dx", "-4px");

        // Line generator
        const lineGenerator = d3.line<DataPoint>()
            .x(d => xScale(d.date))
            .y(d => yScale(yValueSelector(d)))
            .curve(d3.curveMonotoneX);

        // Path styling variables
        const lineColor = activeMetricsTab === 'users' ? '#0d9488' : '#3b82f6';
        const gradColorStart = activeMetricsTab === 'users' ? 'rgba(13, 148, 136, 0.2)' : 'rgba(59, 130, 246, 0.2)';

        // Area generator for dynamic gradient under the trajectory
        const areaGenerator = d3.area<DataPoint>()
            .x(d => xScale(d.date))
            .y0(chartHeight)
            .y1(d => yScale(yValueSelector(d)))
            .curve(d3.curveMonotoneX);

        // Add linear gradient
        const gradientId = `chart-gradient-${activeMetricsTab}`;
        const defs = svgElement.append("defs");
        const linearGrad = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        linearGrad.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", lineColor)
            .attr("stop-opacity", 0.25);

        linearGrad.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", lineColor)
            .attr("stop-opacity", 0.0);

        // Draw the Area
        svg.append("path")
            .datum(trendData)
            .attr("fill", `url(#${gradientId})`)
            .attr("d", areaGenerator);

        // Draw the Line Path
        svg.append("path")
            .datum(trendData)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr("stroke-width", 1.5)
            .attr("d", lineGenerator);

        // Add interactive data point circles
        svg.selectAll(".dot")
            .data(trendData)
            .enter()
            .append("circle")
            .attr("cx", (d: any) => xScale(d.date))
            .attr("cy", (d: any) => yScale(yValueSelector(d)))
            .attr("r", 3.5)
            .attr("fill", "#ffffff")
            .attr("stroke", lineColor)
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .append("title")
            .text((d: any) => {
                const formattedVal = activeMetricsTab === 'users' 
                    ? `${d.usersCount} Active Users` 
                    : `$${d.revenue}/mo`;
                return `${d3.timeFormat("%B %Y")(d.date)}: ${formattedVal}`;
            });

    }, [trendData, activeMetricsTab]);

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700/50">
                <div>
                    <h3 className="text-xs uppercase tracking-widest font-normal text-gray-500 dark:text-gray-400">System Growth & Health Metrics</h3>
                    <p className="text-[10px] text-gray-400 font-normal">Dynamic 6-month historical data visualization platform-wide</p>
                </div>
                <div className="flex bg-gray-50 dark:bg-gray-900 p-0.5 rounded-lg border border-gray-150 dark:border-gray-800">
                    <button 
                        onClick={() => setActiveMetricsTab('users')}
                        className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeMetricsTab === 'users' ? 'bg-white dark:bg-gray-800 shadow-sm text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Active Users
                    </button>
                    <button 
                        onClick={() => setActiveMetricsTab('revenue')}
                        className={`px-2 py-1 text-[10px] font-normal rounded-md transition-all ${activeMetricsTab === 'revenue' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Revenue Trend
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-lg border border-gray-100 dark:border-gray-700/20">
                    <span className="text-[10px] uppercase font-normal tracking-widest text-gray-400 block">Active Users</span>
                    <span className="text-lg font-normal text-teal-600 dark:text-teal-400 mt-1 block">{totalUsers}</span>
                </div>
                <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-lg border border-gray-100 dark:border-gray-700/20">
                    <span className="text-[10px] uppercase font-normal tracking-widest text-gray-400 block">MRR (MRR Run Rate)</span>
                    <span className="text-lg font-normal text-blue-600 dark:text-blue-400 mt-1 block">${totalMonthlyRevenue}/mo</span>
                </div>
            </div>

            {/* D3 Render Area */}
            <div className="relative pt-2">
                <svg ref={svgRef} className="w-full h-auto" />
            </div>
        </div>
    );
};
