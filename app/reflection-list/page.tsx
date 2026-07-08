"use client"

export default function Home() {



return (
  <div className="mx-auto max-w-md md:max-w-lg lg:max-w-xl">
  <h2 className="text-base font-medium">月別の学習状況</h2>

  <div className="flex flex-col gap-6">
  <button>月選択</button>
  </div>
  <p>累計学習日数</p>
  <p>累計学習時間</p>
  <p></p>

  </div>
)
}