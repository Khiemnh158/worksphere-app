import React, { useCallback, useState } from 'react';
import { workspaceApi } from './api';
import { dateTime } from './rules';
import { Button, Card, Copy, useLoad } from './ui';

export const punchLabels = {
  IN: 'Vào ca',
  OUT: 'Ra ca',
  OT_IN: 'Bắt đầu OT',
  OT_OUT: 'Kết thúc OT',
};
const networks: Record<string, string> = {
  MATCH: 'Khớp mạng cấu hình',
  MISMATCH: 'Khác mạng — cần xác minh',
  UNCONFIGURED: 'Chưa cấu hình mạng',
  UNVERIFIED: 'Lượt cũ chưa kiểm tra mạng',
};

export function PunchHistory({ period }: { period: string }) {
  const [page, setPage] = useState(0);
  const state = useLoad(
    useCallback(() => workspaceApi.punchHistory(period, page), [period, page]),
  );
  const data = state.data?.page === page && !state.loading ? state.data : null;
  return (
    <Card>
      <Copy title>Lịch sử lượt quét · {period}</Copy>
      <Copy muted>
        Chỉ trong phạm vi bạn được xem. Giờ máy chủ; lượt quét không tự trở
        thành công hoặc tiền tăng ca đã duyệt.
      </Copy>
      {!!state.error && <Copy>{state.error}</Copy>}
      <Button
        title="Tải lại lịch sử quét"
        secondary
        busy={state.loading}
        onPress={() => void state.refresh()}
      />
      {data && (
        <>
          <Copy>
            {data.total} lượt trong kỳ · Trang {data.page + 1}
          </Copy>
          {!data.items.length && <Copy>Trang này chưa có lượt quét.</Copy>}
          {data.items.map(row => (
            <Card key={row.id}>
              {!!row.full_name && <Copy>{row.full_name}</Copy>}
              <Copy>
                {punchLabels[row.punch_type]} · {dateTime(row.recorded_at)}
              </Copy>
              <Copy muted>{row.station_name ?? 'Điểm chấm công'}</Copy>
              <Copy muted>
                {networks[row.network_status] ?? 'Chờ xác minh mạng'}
              </Copy>
            </Card>
          ))}
        </>
      )}
      {page > 0 && (
        <Button
          title="Lượt quét: trang trước"
          secondary
          busy={state.loading}
          onPress={() => setPage(value => Math.max(0, value - 1))}
        />
      )}
      {data?.hasNext && (
        <Button
          title="Lượt quét: trang sau"
          secondary
          busy={state.loading}
          onPress={() => setPage(value => value + 1)}
        />
      )}
      {page > 0 && (
        <Button
          title="Về trang đầu lượt quét"
          secondary
          busy={state.loading}
          onPress={() => setPage(0)}
        />
      )}
      <Copy muted>
        20 lượt/trang. Khi có lượt mới, quay về trang đầu để cập nhật; danh sách
        không phải bản chụp cố định của cả kỳ.
      </Copy>
    </Card>
  );
}
