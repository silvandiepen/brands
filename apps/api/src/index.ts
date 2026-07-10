export default {
  async fetch(): Promise<Response> {
    return Response.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Open Brands API is not implemented yet.' } },
      { status: 501 },
    )
  },
}
