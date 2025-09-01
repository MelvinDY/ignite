const ExecProfile = ({
  name,
  title,
  imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Andrew_Garfield_Comic-Con_2011_%28Straighten_Crop%29.jpg/250px-Andrew_Garfield_Comic-Con_2011_%28Straighten_Crop%29.jpg",
}: {
  name: string;
  title: string;
  imageUrl?: string;
}) => {
  return (
    <div>
      <img
        className="rounded-full w-32 h-32 object-cover"
        src={imageUrl}
        alt="Executive Picture"
      />
      <p className="text-lg font-bold">{name}</p>
      <p className="text-lg italic">{title}</p>
    </div>
  );
};

export { ExecProfile };
