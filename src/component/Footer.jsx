const year = new Date().getFullYear();
export default function Footer() {
  return (
    <div className="flex justify-between w-full p-2 text-xs opacity-70">
  <div>{year} © Pikchain</div>
  <div>Created by ATIF ❤️</div>
    </div>
  );
}
