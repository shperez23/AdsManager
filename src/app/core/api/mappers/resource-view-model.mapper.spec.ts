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
});
