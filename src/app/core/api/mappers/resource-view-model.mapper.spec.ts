import {
  mapAdAccountDtoToViewModel,
  mapPaginatedResponseDtoToViewModel,
} from './resource-view-model.mapper';

describe('resource-view-model.mapper', () => {
  it('should normalize paginated collections with PascalCase metadata and items', () => {
    const response = mapPaginatedResponseDtoToViewModel(
      {
        Items: [
          {
            Id: 'acc-1',
            Name: 'Main Account',
            Status: 'ACTIVE',
            Currency: 'USD',
            Timezone: 'America/New_York',
          },
        ],
        Page: '2',
        PageSize: '25',
        TotalItems: '51',
        TotalPages: '3',
        HasNext: 'true',
        HasPrevious: 'true',
      },
      mapAdAccountDtoToViewModel,
    );

    expect(response).toEqual({
      items: [
        {
          id: 'acc-1',
          name: 'Main Account',
          status: 'ACTIVE',
          currency: 'USD',
          timezone: 'America/New_York',
        },
      ],
      page: 2,
      pageSize: 25,
      totalItems: 51,
      totalPages: 3,
      hasNext: true,
      hasPrevious: true,
    });
  });

  it('should fallback to sensible defaults when the payload does not expose pagination metadata', () => {
    const response = mapPaginatedResponseDtoToViewModel(
      {
        data: [
          {
            id: 'acc-2',
            name: 'Backup Account',
            status: 'PAUSED',
            businessId: 1234,
          },
        ],
      },
      mapAdAccountDtoToViewModel,
    );

    expect(response.items).toEqual([
      {
        id: 'acc-2',
        name: 'Backup Account',
        status: 'PAUSED',
        businessId: '1234',
      },
    ]);
    expect(response.page).toBe(1);
    expect(response.pageSize).toBe(10);
    expect(response.totalItems).toBe(1);
    expect(response.totalPages).toBe(1);
    expect(response.hasNext).toBeFalse();
    expect(response.hasPrevious).toBeFalse();
  });

  it('should unwrap envelope payloads with nested data.items metadata', () => {
    const response = mapPaginatedResponseDtoToViewModel(
      {
        success: true,
        message: 'OK',
        data: {
          items: [
            {
              id: '7b5f2860-adb1-4dff-8ca6-5a48813300d2',
              metaAccountId: 'act_354012118823245',
              name: 'Sergio Perez',
              currency: 'USD',
              timezoneName: 'Pacific/Galapagos',
              status: '1',
            },
          ],
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
        },
      },
      mapAdAccountDtoToViewModel,
    );

    expect(response).toEqual({
      items: [
        {
          id: '7b5f2860-adb1-4dff-8ca6-5a48813300d2',
          name: 'Sergio Perez',
          status: 'ACTIVE',
          currency: 'USD',
          timezone: 'Pacific/Galapagos',
        },
      ],
      page: 1,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    });
  });
});
