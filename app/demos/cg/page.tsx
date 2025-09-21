"use client";

import D3Example from '@/app/components/CommunityGraph2'

export default function Page() {
  return (
    // 这里给外层 div 一个高度，组件会铺满该 div
    <div className="w-full h-[680px]">
      <D3Example />
    </div>
  )
}