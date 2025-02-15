"use client";

import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <div className="text-center mb-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-full text-sm font-medium mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <svg
          className="w-4 h-4 animate-pulse"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>Powered by HyperLex AI</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="text-5xl md:text-6xl lg:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 mb-8 tracking-tight font-bold animate-gradient"
      >
        Supercharge Your{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Content Research
        </span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <p className="text-2xl md:text-3xl text-gray-700 font-light leading-relaxed">
          Transform your research process with{" "}
          <span className="font-medium text-gray-900">AI-powered insights</span>
        </p>
        <p className="text-lg text-gray-600 leading-relaxed">
          Get comprehensive, accurate, and lightning-fast research results to
          create content that stands out.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mt-12 flex flex-wrap justify-center gap-6 text-sm"
      >
        {[
          {
            icon: "M13 10V3L4 14h7v7l9-11h-7z",
            text: "Lightning Fast",
            color: "text-green-500",
          },
          {
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            text: "Accurate Results",
            color: "text-blue-500",
          },
          {
            icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
            text: "Comprehensive Data",
            color: "text-yellow-500",
          },
        ].map((feature, index) => (
          <motion.div
            key={feature.text}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <svg
              className={`w-5 h-5 ${feature.color}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={feature.icon}
              />
            </svg>
            <span className="font-medium text-gray-800">{feature.text}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroSection;
