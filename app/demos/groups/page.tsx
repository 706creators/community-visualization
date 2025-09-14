"use client";

import Head from 'next/head'
import D3Graph from '@/app/components/D3Graph'

export default function Page() {
    return (
        <div>
          <Head>
            <title>D3 Graph</title>
            <meta name="description" content="D3 Graph" />
            <style>{`
              .links line {
                stroke: #999;
                stroke-opacity: 0.6;
              }
    
              .nodes circle {
                stroke: #fff;
                stroke-width: 1.5px;
              }
    
              path {
                opacity: 0.4;
                stroke-width: 0px;
                pointer-events: none;
              }
            `}</style>
          </Head>
          <D3Graph />
        </div>
      )
}