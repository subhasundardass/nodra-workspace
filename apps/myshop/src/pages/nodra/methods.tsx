type NodraMethodsProps = {
  methods: any[];
};

export default function NodraMethods({ methods }: NodraMethodsProps) {
  return (
    <div>
      {methods.map((method, index) => (
        <div key={index}>
          {typeof method === "string" ? method : JSON.stringify(method)}
        </div>
      ))}
    </div>
  );
}
