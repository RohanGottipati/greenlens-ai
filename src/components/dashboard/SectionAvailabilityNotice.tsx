interface SectionAvailabilityNoticeProps {
  title: string
  message: string
}

export default function SectionAvailabilityNotice({
  title,
  message,
}: SectionAvailabilityNoticeProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
      <p className="text-gray-300 font-medium">{title}</p>
      <p className="text-gray-500 text-sm mt-2">{message}</p>
    </div>
  )
}
