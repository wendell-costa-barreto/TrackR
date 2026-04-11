import { CiCirclePlus } from "react-icons/ci";

export default function NavBar() {
  return (
    <nav className="w-full h-20 flex justify-center items-center">
      <div className="w-[90%] h-full flex justify-between  items-center">
        <div>
          <h1 className="text-3xl">TrackR</h1>
        </div>
        <div className="flex items-center gap-5">
          <input
            type="text"
            className="bg-black w-60 h-8 flex p-2 border border-gray-600 text-white rounded-md"
            placeholder="Search by company or role"
          />
          <button className="w-40 h-8 bg-[#3c4ac4] flex items-center justify-center gap-2 text-white rounded-md font-bold">
            <CiCirclePlus className="stroke-2" />
            Add Application
          </button>
          <button className="w-15 h-12 bg-gray-500 rounded-md">AK</button>
        </div>
      </div>
    </nav>
  );
}
