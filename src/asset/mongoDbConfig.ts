export default function mongoDbConfig() {
  return {
    async start({ endpoints }) {
      const { getServiceAddress } = endpoints
      const {host, port} = endpoints.getServiceEndpoint('dataServer')
      return {
        mongodb: {
          db: "flowershop"
        }
      }
    }
  }
}